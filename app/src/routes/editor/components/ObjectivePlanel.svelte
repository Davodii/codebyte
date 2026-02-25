<script lang="ts">
    let { name, description, objectives } = $props();

    export function moveToNextObjective() : void {

    }
</script>

<h1>{name}</h1>
<hr>
<div class="panel-content">
    <p>{description}</p>
    <hr>
    <!-- TODO: show the objectives that need to be completed -->
    <ul>
        {#each objectives as objective}
        <li>
            <span class="objective-title">objective.name</span>
            <!-- TODO: show status of the objective -->
        </li>
        {/each}
    </ul>
</div>

<style>
.panel-content {
    flex-grow: 1;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
}
</style>